/*
 * RHQ Management Platform
 * Copyright (C) 2005-2008 Red Hat, Inc.
 * All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2, as
 * published by the Free Software Foundation, and/or the GNU Lesser
 * General Public License, version 2.1, also as published by the Free
 * Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License and the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License
 * and the GNU Lesser General Public License along with this program;
 * if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 */

/**
 * Thus test script works with a real env including at least one platform resource and a running agent on
 * said platform.
 */

var TestsEnabled = true;

var bundleName = 'test-cli-bundle';

// note, super-user, will not test any security constraints
var subject = rhq.login('rhqadmin', 'rhqadmin');

executeAllTests();

rhq.logout();

function testDeployment() {
   if ( !TestsEnabled ) {
      return;
   }
   
   // delete the test bundle if it exists
   cleanupTestBundle();

   // create the test bundle version
   var distributionFile = new java.io.File("./src/test/resources/cli-test-bundle.zip");
   distributionFile = new java.io.File(distributionFile.getAbsolutePath());
   var testBundleVersion = BundleManager.createBundleVersionViaFile( distributionFile );
         
   // there in no required config, it uses only the built in rhq.deploy.dir property

   // Find a target platform group
   var rgc = new ResourceGroupCriteria();
   rgc.addFilterName("platforms"); // wINdows, lINux
   var groups = ResourceGroupManager.findResourceGroupsByCriteria(rgc);
   var groupId;
   // create if needed (and possible)
   if ( groups.isEmpty() ) {
      var c = new ResourceCriteria();
      c.addFilterResourceCategory(ResourceCategory.PLATFORM);
      var platforms = ResourceManager.findResourcesByCriteria(c);
      Assert.assertTrue( platforms.size() > 0 );
      
      var rg = new ResourceGroup("platforms");
      var platformSet = new java.util.HashSet();
      platformSet.addAll( platforms );
      rg.setExplicitResources(platformSet);
      rg = ResourceGroupManager.createResourceGroup(rg);
      groupId = rg.getId();
   } else { 
      groupId = groups.get(0).getId();
   }

   // create a destination to deploy to
   var testDest = BundleManager.createBundleDestination( testBundleVersion.getBundle().getId(), "Deployment Test Dest", "test Dest", "/tmp/bundle-test", groupId);

   // create a deployment using the above config
   var testDeployment = BundleManager.createBundleDeployment(testBundleVersion.getId(), testDest.getId(), "Deployment Test of testBundle WAR", new Configuration());

   // deploy to the destination
   var bd = BundleManager.scheduleBundleDeployment(testDeployment.getId(), false);
   Assert.assertNotNull( bd );      
   
   // delete the test bundle if it exists (after allowing agent audit messages to complete)
   //sleep( 5000 );
   //cleanupTestBundle();
}

function getBundleType() {
 
   var types = BundleManager.getAllBundleTypes();
   for (i=0; ( i < types.size()); ++i ) {
      if ( types.get(i).getName().equals( "File Template Bundle" )) {
         return types.get(i).getId();
      }
   }
   
   print( "\n Could not find template bundle type, is the plugin loaded?");
}

function cleanupTestBundle() {
   // delete the test bundle if it exists
   var bc = new BundleCriteria();
   bc.setStrict( true );
   bc.addFilterName( bundleName );
   var bundles = BundleManager.findBundlesByCriteria( bc );
   if ( null != bundles && bundles.size() > 0 ) {
      print( "\n Deleting existing testScriptBundle in order to test a fresh deploy...")
      BundleManager.deleteBundle( bundles.get(0).getId() );      
   }
}

